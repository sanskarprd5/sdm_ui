import { ComponentFixture, TestBed, fakeAsync, tick } from '@angular/core/testing';
import { SimpleChange } from '@angular/core';

import { UploadDialogComponent } from './upload-dialog.component';

describe('UploadDialogComponent', () => {
  let component: UploadDialogComponent;
  let fixture: ComponentFixture<UploadDialogComponent>;
  let alertSpy: jasmine.Spy;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [UploadDialogComponent]
    })
    .compileComponents();

    fixture = TestBed.createComponent(UploadDialogComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
    alertSpy = spyOn(window, 'alert').and.stub();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });

  it('should compute accepted file types from allowed list', () => {
    component.allowedFileTypes = ['PDF', 'doc'];
    expect(component.acceptFileTypes).toBe('.pdf,.doc');
  });

  it('should set selected file when file passes validation', () => {
    const file = new File(['data'], 'test.pdf');
    component.allowedFileTypes = ['PDF'];
    component.maxFileSize = 10;

    component.handleFile(file);

    expect(component.selectedFile).toBe(file);
    expect(alertSpy).not.toHaveBeenCalled();
  });

  it('should reject files with invalid type', () => {
    const file = new File(['data'], 'test.txt');
    component.allowedFileTypes = ['PDF'];

    component.handleFile(file);

    expect(component.selectedFile).toBeNull();
    expect(alertSpy).toHaveBeenCalledWith('Only PDF files are allowed');
  });

  it('should reject files exceeding max size', () => {
    const oversized = new File([new Uint8Array(2 * 1024 * 1024)], 'huge.pdf');
    component.allowedFileTypes = ['PDF'];
    component.maxFileSize = 1; // 1 MB

    component.handleFile(oversized);

    expect(component.selectedFile).toBeNull();
    expect(alertSpy).toHaveBeenCalledWith('File size must not exceed 1 MB');
  });

  it('should emit fileSelected when uploading a valid file', () => {
    const file = new File(['data'], 'doc.pdf');
    component.selectedFile = file;
    const emitSpy = spyOn(component.fileSelected, 'emit');

    component.onUpload();

    expect(component.isUploading).toBeTrue();
    expect(emitSpy).toHaveBeenCalledWith(file);
  });

  it('should prompt for file when uploading without selection', () => {
    component.selectedFile = null;

    component.onUpload();

    expect(alertSpy).toHaveBeenCalledWith('Please select a file first');
  });

  it('should emit cancel and close dialog on user cancellation', fakeAsync(() => {
    const cancelSpy = spyOn(component.cancel, 'emit');
    const visibilitySpy = spyOn(component.visibleChange, 'emit');
    component.visible = true;

    component.onCancel();
    tick(150); // allow reset timeout to run

    expect(cancelSpy).toHaveBeenCalled();
    expect(visibilitySpy).toHaveBeenCalledWith(false);
    expect(component.visible).toBeFalse();
    expect(component.selectedFile).toBeNull();
  }));

  it('should reset dialog state when visibility toggles to true', fakeAsync(() => {
    const file = new File(['data'], 'keep.pdf');
    const mockInput = { value: 'fake-path' } as HTMLInputElement;
    spyOn(document, 'getElementById').and.returnValue(mockInput);
    component.selectedFile = file;

    component.ngOnChanges({ visible: new SimpleChange(false, true, false) });
    tick(150);

    expect(component.selectedFile).toBeNull();
    expect(mockInput.value).toBe('');
    expect(component.dragOver).toBeFalse();
    expect(component.isUploading).toBeFalse();
  }));

  it('should clear input value when removing file', () => {
    component.selectedFile = new File(['data'], 'remove.pdf');
    const mockInput = { value: 'fake-path' } as HTMLInputElement;
    spyOn(document, 'getElementById').and.returnValue(mockInput);

    component.removeFile();

    expect(component.selectedFile).toBeNull();
    expect(mockInput.value).toBe('');
  });

  it('should toggle dragOver flag via drag events', () => {
    const event = {
      preventDefault: jasmine.createSpy('preventDefault'),
      stopPropagation: jasmine.createSpy('stopPropagation')
    } as unknown as DragEvent;

    component.onDragOver(event);
    expect(component.dragOver).toBeTrue();

    component.onDragLeave(event);
    expect(component.dragOver).toBeFalse();
  });

  it('should process dropped files and stop drag state', () => {
    const file = new File(['data'], 'drop.pdf');
    const files = { length: 1, 0: file, item: () => file } as unknown as FileList;
    const handleSpy = spyOn(component, 'handleFile').and.callThrough();
    component.dragOver = true;

    const dropEvent = {
      preventDefault: jasmine.createSpy('preventDefault'),
      stopPropagation: jasmine.createSpy('stopPropagation'),
      dataTransfer: { files }
    } as unknown as DragEvent;

    component.onDrop(dropEvent);

    expect(dropEvent.preventDefault).toHaveBeenCalled();
    expect(component.dragOver).toBeFalse();
    expect(handleSpy).toHaveBeenCalledWith(file);
  });

  it('should trigger hidden file input click', () => {
    const mockInput = { click: jasmine.createSpy('click') } as unknown as HTMLInputElement;
    spyOn(document, 'getElementById').and.returnValue(mockInput);

    component.triggerFileInput();

    expect(mockInput.click).toHaveBeenCalled();
  });
});
